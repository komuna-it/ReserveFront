export interface RoomDailyStatisticsDto {
  roomId: number;
  roomName: string;
  reservations: number;
  earnings: number;
  unpaidEarnings: number;
}

export interface DailyStatisticsDto {
  date: string;
  rooms: RoomDailyStatisticsDto[];
  total: number;
  earnings: number;
  unpaidEarnings: number;
}

export interface StatisticsCountsDto {
  totalUsers: number;
  totalOrganizations: number;
}

export type StatisticsView = 'reservations' | 'earnings';
