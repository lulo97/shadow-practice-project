public enum JobStatus
{
    Queued,
    Running,
    Done,
    Failed
}

public enum JobType
{
    VideoIngest,
    Translation
}

public enum JobStepStatus
{
    PENDING, RUNNING, DONE, FAILED, SKIPPED
}