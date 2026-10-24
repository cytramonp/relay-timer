const buttons=[...document.querySelectorAll('[data-mobile-target]')];
function select(view){document.body.dataset.mobileView=view;for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.mobileTarget===view));}
for(const button of buttons)button.addEventListener('click',()=>{select(button.dataset.mobileTarget);document.getElementById('mobile-workspace-nav').scrollIntoView({block:'start',behavior:'instant'});});
document.getElementById('mobile-return').addEventListener('click',()=>select('timer'));
select('timer');
function update(){const name=document.getElementById('ovName').textContent,time=document.getElementById('ovTime').textContent;document.getElementById('mobile-current-name').textContent=name;document.getElementById('mobile-current-time').textContent=time;}
document.addEventListener('relay:tick',update);document.addEventListener('relay:change',update);update();
