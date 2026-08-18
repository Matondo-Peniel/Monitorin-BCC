async function request(path,options={}){const response=await fetch(`/api${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});if(response.status===204)return null;const body=await response.json().catch(()=>({}));if(!response.ok){const message=body.message||body.title||Object.values(body.errors||{}).flat().join(' ')||'Une erreur est survenue.';throw new Error(message)}return body}
export const api={
 me:()=>request('/auth/moi'),initialization:()=>request('/initialisation/statut'),
 login:data=>request('/auth/connexion',{method:'POST',body:JSON.stringify(data)}),logout:()=>request('/auth/deconnexion',{method:'POST'}),
 setup:data=>request('/initialisation/premier-administrateur',{method:'POST',body:JSON.stringify(data)}),
 forgot:email=>request('/auth/mot-de-passe-oublie',{method:'POST',body:JSON.stringify({email})}),
 reset:data=>request('/auth/reinitialiser-mot-de-passe',{method:'POST',body:JSON.stringify(data)}),
 sources:()=>request('/sources'),latest:id=>request(`/monitoring/latest?sourceId=${id}`),
 summary:(id,debut,fin)=>request(`/monitoring/summary?sourceId=${id}&debut=${debut}&fin=${fin}`),
 history:(id,debut,fin,page=1,taille=20)=>request(`/monitoring?sourceId=${id}&debut=${debut}&fin=${fin}&page=${page}&taille=${taille}`),
 alerts:()=>request('/alertes'),users:()=>request('/utilisateurs'),invite:data=>request('/utilisateurs/inviter',{method:'POST',body:JSON.stringify(data)})
};
