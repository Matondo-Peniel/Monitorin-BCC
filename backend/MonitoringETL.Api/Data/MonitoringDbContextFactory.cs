using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace MonitoringETL.Api.Data;

public sealed class MonitoringDbContextFactory:IDesignTimeDbContextFactory<MonitoringDbContext>{
 public MonitoringDbContext CreateDbContext(string[] args){
  var connection=Environment.GetEnvironmentVariable("ConnectionStrings__MonitoringDatabase")??"Server=.;Database=MonitoringETL_BCC;Integrated Security=True;Encrypt=False";
  var options=new DbContextOptionsBuilder<MonitoringDbContext>().UseSqlServer(connection).Options;
  return new MonitoringDbContext(options);
 }
}
