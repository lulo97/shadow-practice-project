public static class Utils
{
    public static string GetStrongToken()
    {
        //32 + 32 hexadecimal characters
        return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    }
}