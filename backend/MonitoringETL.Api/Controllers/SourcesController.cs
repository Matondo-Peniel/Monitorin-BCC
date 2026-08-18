using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
namespace MonitoringETL.Api.Controllers;

[ApiController,Route("api/sources")]
public sealed class SourcesController(MonitoringDbContext db):ControllerBase{
 [HttpGet]public async Task<IActionResult> List(CancellationToken ct)=>Ok(await db.Connexions.AsNoTracking().Where(x=>x.Actif).OrderBy(x=>x.NomConnexion).Select(x=>new{x.IdConnexion,x.NomConnexion,x.TypeConnexion,x.NomServeur,x.NomBase,x.NomTableMonitoring,x.Actif}).ToListAsync(ct));
 [HttpGet("{id:int}")]public async Task<IActionResult> Get(int id,CancellationToken ct){var source=await db.Connexions.AsNoTracking().Where(x=>x.IdConnexion==id).Select(x=>new{x.IdConnexion,x.NomConnexion,x.TypeConnexion,x.NomServeur,x.NomBase,x.NomTableMonitoring,x.Actif}).SingleOrDefaultAsync(ct);return source is null?NotFound():Ok(source);}
}
