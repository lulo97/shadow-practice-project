public static class Utils
{
    public static int ADMIN_ID = -1;

    public static string GetStrongToken()
    {
        //32 + 32 hexadecimal characters
        return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    }
}