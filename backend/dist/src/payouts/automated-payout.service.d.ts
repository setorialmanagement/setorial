import { Queue } from 'bullmq';
export declare class AutomatedPayoutService {
    private payoutsQueue?;
    private readonly logger;
    constructor(payoutsQueue?: Queue | undefined);
    triggerMonthlyPayout(): Promise<void>;
}
