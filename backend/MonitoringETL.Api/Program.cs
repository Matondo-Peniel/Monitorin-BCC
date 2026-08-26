using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

var builder=WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Logging.ClearProviders();builder.Logging.AddConsole();
var connectionString=builder.Configuration.GetConnectionString("MonitoringDatabase")??throw new InvalidOperationException("La chaîne ConnectionStrings:MonitoringDatabase est absente.");
builder.Services.AddDbContext<MonitoringDbContext>(options=>options.UseSqlServer(connectionString));
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath,".data-protection-keys")));
builder.Services.AddIdentity<ApplicationUser,IdentityRole<Guid>>(options=>{options.Password.RequiredLength=8;options.Password.RequireDigit=true;options.Password.RequireUppercase=true;options.Password.RequireLowercase=true;options.Password.RequireNonAlphanumeric=true;options.User.RequireUniqueEmail=true;options.SignIn.RequireConfirmedEmail=true;options.Lockout.MaxFailedAccessAttempts=5;options.Lockout.DefaultLockoutTimeSpan=TimeSpan.FromMinutes(15);}).AddEntityFrameworkStores<MonitoringDbContext>().AddDefaultTokenProviders();
builder.Services.ConfigureApplicationCookie(options=>{options.Cookie.Name="MonitoringETL.Auth";options.Cookie.HttpOnly=true;options.Cookie.SameSite=SameSiteMode.Lax;options.Cookie.SecurePolicy=CookieSecurePolicy.SameAsRequest;options.SlidingExpiration=true;options.ExpireTimeSpan=TimeSpan.FromHours(8);options.Events.OnRedirectToLogin=context=>{context.Response.StatusCode=StatusCodes.Status401Unauthorized;return Task.CompletedTask;};options.Events.OnRedirectToAccessDenied=context=>{context.Response.StatusCode=StatusCodes.Status403Forbidden;return Task.CompletedTask;};});
builder.Services.AddControllers();
builder.Services.AddCors(options=>options.AddPolicy("Frontend",policy=>policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
var app=builder.Build();
var configuredPhotoStorage=app.Configuration["ProfileStorage:Path"];
var photoStorage=string.IsNullOrWhiteSpace(configuredPhotoStorage)
 ? Path.Combine(app.Environment.ContentRootPath,"App_Data","profiles")
 : Path.IsPathRooted(configuredPhotoStorage) ? configuredPhotoStorage : Path.Combine(app.Environment.ContentRootPath,configuredPhotoStorage);
Directory.CreateDirectory(photoStorage);
app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions{FileProvider=new PhysicalFileProvider(photoStorage),RequestPath="/uploads/profiles"});
app.UseCors("Frontend");app.UseAuthentication();app.UseAuthorization();app.MapControllers();app.MapGet("/api/health",async(MonitoringDbContext db,CancellationToken ct)=>{var connected=await db.Database.CanConnectAsync(ct);return Results.Ok(new{status=connected?"OK":"DATABASE_UNAVAILABLE",database="MonitoringETL_BCC"});});app.Run();
public partial class Program;
