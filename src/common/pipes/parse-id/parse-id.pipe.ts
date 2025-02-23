import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('Value received in pipe:', value, typeof value);
    console.log('Metadata:', metadata);
    
    const id = Number(value);
    console.log('Converted ID:', id);
    
    if (isNaN(id)) {
      throw new BadRequestException('ID harus berupa angka');
    }
    
    return id;
  }
}
