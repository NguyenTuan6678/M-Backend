import * as bcrypt from 'bcrypt';
import { Schema, Document } from 'mongoose';

export function createUserPreSaveHooks(schema: Schema): void {
  // Use 'post' pattern to avoid type issues
  const schemaAny = schema as any;

  schemaAny.pre(
    'save',
    async function (this: Document, next: (err?: any) => void) {
      try {
        if (!this.isModified('password')) {
          return next();
        }

        const salt = await bcrypt.genSalt(10);
        const password = String(this.get('password'));
        this.set('password', await bcrypt.hash(password, salt));

        next();
      } catch (error) {
        next(error);
      }
    },
  );
}
