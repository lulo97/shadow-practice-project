using System.Runtime.Intrinsics.X86;

public class JobStepScope : IAsyncDisposable
{
    private readonly JobStep _step;
    private readonly AppDbContext _context;
    private bool _completed;

    public JobStepScope(JobStep step, AppDbContext context)
    {
        _step = step;
        _context = context;
    }

    public async Task Complete(string? note = null)
    {
        _step.Status = JobStepStatus.DONE;
        _step.EndedAt = DateTime.UtcNow;
        if (note != null) _step.Note = note;
        await _context.SaveChangesAsync();
        _completed = true;
    }

    // Called automatically at end of `await using` block
    // If Complete() was never called, the step threw — mark it Failed
    public async ValueTask DisposeAsync()
    {
        if (!_completed)
        {
            _step.Status = JobStepStatus.FAILED;
            _step.EndedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}