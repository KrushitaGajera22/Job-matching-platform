export class BulkImportResponseDto {
  total!: number;
  imported!: number;
  failed!: number;
  errors!: string[];
}
