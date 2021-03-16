export type ZombiStatsReturnData = {
    exec_count: number,
    exec_time: number,
    db_time: number,
    db_count: number,
    db_errors_time: number,
    db_errors_count: number,
    exec_errors_time: number,
    exec_errors_count: number,
    exec_remaining_time_max: number,
    exec_remaining_time_min: number,
    start_timestamp: number, 
    current_timestamp: number,
    fun_time: any[][],
    fun_count: any[][],
    fun_avg: any[][],
    fun_max: { [key: string]: any },
    fun_min: { [key: string]: any }
};