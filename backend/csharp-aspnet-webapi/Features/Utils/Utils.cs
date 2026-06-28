public static class Utils
{
    public static int ADMIN_ID = -1;
    public static int TEST_USER_ID = -2;

    public static string LOCAL_FILE_PATH = "Files";

    public static string GetStrongToken()
    {
        //32 + 32 hexadecimal characters
        return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    }
}