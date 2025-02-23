import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {

  constructor(private readonly schema: ZodSchema) {}
  transform(value: any, metadata: ArgumentMetadata) {
    try {
      if (metadata.type === 'body') {
        const result = this.schema.parse(value);
        return result;
      }

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
