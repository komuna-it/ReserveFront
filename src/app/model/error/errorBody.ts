export interface ErrorBody {
  errors: Record<string, string[]> | { [key: string]: string[] };
}
