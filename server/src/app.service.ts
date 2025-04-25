import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs";
import { UploadedFileRepository } from "./upload/uploaded-file.repository";
import { UploadedFileEntity } from "./upload/uploaded-file.entity";
import { join, resolve } from "path";
import { DEFAULT_FILES_LIFETIME_DAYS, paths } from "./main";

@Injectable()
export class AppService {
    constructor(private config: ConfigService, private readonly uploadedFileRepository: UploadedFileRepository) {}

    async getFileByToken(token: string) {
        return this.uploadedFileRepository.findFileByToken(token);
    }

    async getFile(fileId: number) {
        return this.uploadedFileRepository.findOneBy({ id: fileId });
    }

    getWebsiteSettings() {
        const allowedIpsFilePath = paths.allowedIpsFile
        const tokensFilePath = paths.tokensFile;
        if (!fs.existsSync(allowedIpsFilePath) || !fs.existsSync(tokensFilePath)) {
            throw new Error(`Files does not exist: ${allowedIpsFilePath}`);
        }
        const allowedIps: string[] = fs.readFileSync(resolve(allowedIpsFilePath), 'utf-8')
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter(Boolean);
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
        const allowedIpsFilePath = paths.allowedIpsFile;
        const tokensFilePath = paths.tokensFile;
        const ipAddresses = ipAddressesRaw.map(line => line.trim()).filter(Boolean);
        const accessTokens = accessTokensRaw.map(line => line.trim()).filter(Boolean);

        fs.writeFileSync(resolve(allowedIpsFilePath), ipAddresses.join('\n'));
        fs.writeFileSync(resolve(tokensFilePath), accessTokens.join('\n'));
    }

    async saveFile(fileName: string, sessionId: string, uploadDir: string): Promise<UploadedFileEntity> {
        return this.uploadedFileRepository.saveFileInDb(fileName, sessionId, uploadDir);
    }

    async getUserFiles(sessionId: string, uploadDir: string) {
        const dir = resolve(join(paths.uploads, uploadDir));
        const uploadedFilesTtl = parseInt(this.config.get('UPLOADED_FILES_LIFETIME_DAYS', DEFAULT_FILES_LIFETIME_DAYS+''));

        if (fs.existsSync(dir)) {
            const fsFiles = fs.readdirSync(dir).map((filename) => {
                const filePath = join(dir, filename);
                const stats = fs.statSync(filePath);

                const fileStat: TFileStat = {
                    name: filename,
                    size: stats.size,
                    mtime: stats.mtime,
                };

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
                            downloadLink: `/d/${fileTokenData.token}`,
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
        const uploadPath = resolve(join(paths.uploads, uploadDir));
        if (fileData) {
            const filePath = resolve(join(uploadPath, fileData.fileName));
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
