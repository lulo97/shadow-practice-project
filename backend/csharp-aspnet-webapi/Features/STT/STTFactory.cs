public class STTFactory : ISTTFactory
{
    private readonly IServiceProvider serviceProvider;

    public STTFactory(
        IServiceProvider serviceProvider
        )
    {
        this.serviceProvider = serviceProvider;
    }


    public ISTT GetSTT(UserSetting setting)
    {
        return setting.SttProviderKey switch
        {
            "WHISPER_CPP" =>
                serviceProvider.GetRequiredService<WhisperCpp>(),

            "PARAKEET" =>
                serviceProvider.GetRequiredService<Parakeet>(),

            _ =>
                throw new Exception("Unknown STT")
        };
    }
}