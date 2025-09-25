import { CreateDailyDrillingReportDto } from '../dtos/create-daily-drilling-report.dto';
export class CreateDailyDrillingReportCommand {
  constructor(public readonly dto: CreateDailyDrillingReportDto) {}
}
