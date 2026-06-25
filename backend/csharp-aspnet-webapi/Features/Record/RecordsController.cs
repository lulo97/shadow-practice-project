using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecordsController(AppDbContext context)
    {
        _context = context;
    }
}


