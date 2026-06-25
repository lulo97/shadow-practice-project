public interface ISTT
{
    public Task<string> RunAsync(byte[] blob);
    public string GetKey();
}
