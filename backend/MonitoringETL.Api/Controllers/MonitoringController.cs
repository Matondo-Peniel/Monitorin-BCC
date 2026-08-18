using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
namespace MonitoringETL.Api.Controllers;

[Authorize,ApiController,Route("api/monitoring")]
public sealed class MonitoringController(MonitoringDbContext db):ControllerBase{
 [HttpGet("latest")]public async Task<IActionResult> Latest([FromQuery]int sourceId,CancellationToken ct){var row=await db.SuiviChargements.AsNoTracking().Where(x=>x.IdConnexion==sourceId).OrderByDescending(x=>x.DateHeureETL).Select(x=>new{x.Id,x.DateHeureETL,x.Staging,x.Entrepot,Statut=x.Staging?(x.Entrepot?"REUSSI":"PARTIEL"):"ECHEC"}).FirstOrDefaultAsync(ct);if(row is null)return Ok(new{statut="NO_DATA",donnee=(object?)null});return Ok(new{statut="OK",donnee=row});}
 [HttpGet]public async Task<IActionResult> Range([FromQuery]int sourceId,[FromQuery]DateTime debut,[FromQuery]DateTime fin,[FromQuery]int page=1,[FromQuery]int taille=20,CancellationToken ct=default){if(fin<=debut)return BadRequest("La date de fin doit être postérieure à la date de début.");page=Math.Max(1,page);taille=Math.Clamp(taille,1,100);var query=db.SuiviChargements.AsNoTracking().Where(x=>x.IdConnexion==sourceId&&x.DateHeureETL>=debut&&x.DateHeureETL<fin);var total=await query.CountAsync(ct);var rows=await query.OrderByDescending(x=>x.DateHeureETL).Skip((page-1)*taille).Take(taille).Select(x=>new{x.Id,x.DateHeureETL,x.Staging,x.Entrepot,Statut=x.Staging?(x.Entrepot?"REUSSI":"PARTIEL"):"ECHEC"}).ToListAsync(ct);return Ok(new{statut=total==0?"NO_DATA":"OK",total,page,taille,donnees=rows});}
 [HttpGet("summary")]public async Task<IActionResult> Summary([FromQuery]int sourceId,[FromQuery]DateTime debut,[FromQuery]DateTime fin,CancellationToken ct){var q=db.SuiviChargements.AsNoTracking().Where(x=>x.IdConnexion==sourceId&&x.DateHeureETL>=debut&&x.DateHeureETL<fin);var total=await q.CountAsync(ct);if(total==0)return Ok(new{statut="NO_DATA",total=0});var staging=await q.CountAsync(x=>x.Staging,ct);var entrepot=await q.CountAsync(x=>x.Entrepot,ct);return Ok(new{statut="OK",total,reussitesCompletes=await q.CountAsync(x=>x.Staging&&x.Entrepot,ct),echecsStaging=total-staging,echecsEntrepot=await q.CountAsync(x=>x.Staging&&!x.Entrepot,ct),tauxStaging=Math.Round(staging*100m/total,2),tauxEntrepot=Math.Round(entrepot*100m/total,2)});}
}
