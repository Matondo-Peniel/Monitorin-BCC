using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

var builder=WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();builder.Logging.AddConsole();
var connectionString=builder.Configuration.GetConnectionString("MonitoringDatabase")??throw new InvalidOperationException("La chaîne ConnectionStrings:MonitoringDatabase est absente.");
builder.Services.AddDbContext<MonitoringDbContext>(options=>options.UseSqlServer(connectionString));
var dataProtection=builder.Services.AddDataProtection();
if(builder.Environment.IsDevelopment())dataProtection.UseEphemeralDataProtectionProvider();
builder.Services.AddIdentityCore<ApplicationUser>(options=>{options.Password.RequiredLength=12;options.Password.RequireDigit=true;options.Password.RequireUppercase=true;options.Password.RequireLowercase=true;options.Password.RequireNonAlphanumeric=true;options.User.RequireUniqueEmail=true;}).AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<MonitoringDbContext>().AddDefaultTokenProviders();
builder.Services.AddControllers();
builder.Services.AddCors(options=>options.AddPolicy("Frontend",policy=>policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));
var app=builder.Build();app.UseHttpsRedirection();app.UseCors("Frontend");app.UseAuthentication();app.UseAuthorization();app.MapControllers();app.MapGet("/api/health",async(MonitoringDbContext db,CancellationToken ct)=>{var connected=await db.Database.CanConnectAsync(ct);return Results.Ok(new{status=connected?"OK":"DATABASE_UNAVAILABLE",database="MonitoringETL_BCC"});});app.Run();
public partial class Program;
