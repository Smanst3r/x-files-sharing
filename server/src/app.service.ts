import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs";
import * as path from "path";
import { UploadedFileRepository } from "./uploaded-file.repository";
import { UploadedFileEntity } from "./uploaded-file.entity";

@Injectable()
export class AppService {
    constructor(private config: ConfigService, private readonly uploadedFileRepository: UploadedFileRepository) {}

    getHello(): string {
        return 'Hello World!';
    }

    async getFileByToken(token: string) {
        return this.uploadedFileRepository.findFileByToken(token);
    }

    async getFile(fileId: number) {
        return this.uploadedFileRepository.findOneBy({ id: fileId });
    }

    getWebsiteSettings() {
        const allowedIpsFilePath = this.config.get('ALLOWED_IPS_FILE_PATH', '');
        const allowedIps: string[] = fs.readFileSync(path.resolve(allowedIpsFilePath), 'utf-8')
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter(Boolean);

        const tokensFilePath = this.config.get('TOKENS_FILE_PATH', '');
        const accessTokens: string[] = fs.readFileSync(tokensFilePath, 'utf-8')
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter(Boolean);

        return {
            allowedIpAddresses: allowedIps,
            accessTokens: accessTokens,
        }
    }

    saveWebsiteSettings(ipAddressesRaw: string[], accessTokensRaw: string[]) {
        const allowedIpsFilePath = this.config.get('ALLOWED_IPS_FILE_PATH', '');
        const tokensFilePath = this.config.get('TOKENS_FILE_PATH', '');
        const ipAddresses = ipAddressesRaw.map(line => line.trim()).filter(Boolean);
        const accessTokens = accessTokensRaw.map(line => line.trim()).filter(Boolean);

        fs.writeFileSync(path.resolve(allowedIpsFilePath), ipAddresses.join('\n'));
        fs.writeFileSync(path.resolve(tokensFilePath), accessTokens.join('\n'));
    }

    async saveFile(fileName: string, sessionId: string, uploadDir: string): Promise<UploadedFileEntity> {
        return this.uploadedFileRepository.saveFileInDb(fileName, sessionId, uploadDir);
    }

    async getUserFiles(sessionId: string, uploadDir: string) {
        const dir = path.resolve(`uploads/${uploadDir}`);
        const uploadedFilesTtl = parseInt(this.config.get('UPLOADED_FILES_LIFETIME_DAYS', '0'));

        if (fs.existsSync(dir)) {
            const fsFiles = fs.readdirSync(dir).map((filename) => {
                const filePath = path.join(dir, filename);
                const stats = fs.statSync(filePath);

                const fileStat: TFileStat = {
                    name: filename,
                    size: stats.size,
                    mtime: stats.mtime,
                    ctime: stats.ctime,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                };
                if (uploadedFilesTtl) {
                    fileStat.dateOfRemoval = new Date(stats.mtime.getTime() + uploadedFilesTtl * 24 * 60 * 60 * 1000);
                }

                return fileStat;
            });

            // Sort desc by mtime
            fsFiles.sort((file1, file2) => file2.mtime.getTime() - file1.mtime.getTime());

            return await Promise.all(
                fsFiles.map(async (file) => {
                    const fileTokenData = await this.uploadedFileRepository.findOneBy({
                        fileName: file.name,
                        sessionId: sessionId,
                    });

                    const uploadedFile = {
                        stat: file,
                        ...(fileTokenData && {
                            id: fileTokenData.id,
                            token: fileTokenData.token,
                            tokenExpiresAt: fileTokenData.expiresAt,
                            tokenIsExpired: new Date() > fileTokenData.expiresAt,
                            downloadLink: `/share/${fileTokenData.token}`,
                        })
                    };

                    return uploadedFile;
                }),
            );
        }
        return [];
    }

    async removeFile(uploadDir: string, fileId: number) {
        const fileData = await this.uploadedFileRepository.findOneBy({ id: fileId });
        if (fileData) {
            const filePath = path.resolve(`uploads/${uploadDir}/${fileData.fileName}`);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        throw new Error('Error deleting file');
                    }
                });
            }
            await this.uploadedFileRepository.remove(fileId);
        }
        return true;
    }
}
