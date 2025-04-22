import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_token_invalid_attempts' })
export class AuthInvalidAttemptEntity {
    @PrimaryColumn()
    ip: string;

    @Column({ type: 'integer', default: 0 })
    attempts: number;

    @Column({ type: 'datetime' })
    lastAttemptAt: Date;
}
