import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity("uploaded_files")
@Index(['sessionId', 'fileName'], { unique: true })
export class UploadedFileEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    sessionId: string;

    @Column()
    token: string;

    @Column()
    fileName: string;

    @Column()
    dirName: string;

    @Column()
    expiresAt: Date;
}
