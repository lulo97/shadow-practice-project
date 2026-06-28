public class FakeLlm : ILLM
{
    public async Task<string> RunAsync(string text)
    {
        await Task.Delay(1000);

        return text;
    }
}

