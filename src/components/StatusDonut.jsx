import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
ChartJS.register(ArcElement, Tooltip);

export default function StatusDonut({ metrics = {} }) {
  const ok=metrics.globalRate||0, failed=Math.max(0,100-ok);
  const data={datasets:[{data:[ok,failed],backgroundColor:['#08a765','#ef4151'],borderWidth:0}]};
  return <section className="card panel status-panel"><h2>Répartition par statut (Aujourd’hui)</h2><div className="donut-wrap"><div className="donut-box"><Doughnut data={data} options={{responsive:true,maintainAspectRatio:false,cutout:'64%',plugins:{tooltip:{enabled:false}}}}/><span><b>{ok}%</b><small>réussite</small></span></div><ul className="status-legend"><li className="green"><b>Réussis ({metrics.warehouseSuccess||0})</b><small>{ok}% des chargements</small></li><li className="red"><b>Échoués ({metrics.warehouseFailed||0})</b><small>{failed}% des chargements</small></li></ul></div></section>;
}
