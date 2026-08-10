export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
export const initialPage: Page<any> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  number: 0,
  size: 10,
  first: true,
  last: true,
};
