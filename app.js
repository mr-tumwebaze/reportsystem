import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://gtfwedtafkbosdrihboh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PnPtc8w0Art8sv03QSAqow_f8jXNACX';
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
let user=null, schoolId=null, role='', students=[], assessments=[], currentAssessment=null;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(msg,error=false){$('notice').textContent=msg;$('notice').classList.toggle('error',error);$('notice').classList.remove('hidden')}
function clearNotice(){$('notice').classList.add('hidden')}
function showView(view){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$('view-'+view)?.classList.remove('hidden');document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$('pageTitle').textContent=({overview:'Overview',students:'Students',assessments:'Assessments & Marks',reports:'Report Cards',settings:'Account & Setup'})[view]||view}
async function refreshSession(){const {data:{session}}=await db.auth.getSession();if(session){user=session.user;await enterWorkspace()}else{user=null;$('authPanel').classList.remove('hidden');$('workspace').classList.add('hidden')}}
async function enterWorkspace(){
 $('authPanel').classList.add('hidden');$('workspace').classList.remove('hidden');$('userEmail').textContent=user.email;$('settingsEmail').textContent=user.email;$('userAvatar').textContent=(user.email||'B')[0].toUpperCase();clearNotice();
 const {data:members,error}=await db.from('school_memberships').select('school_id,role,active,schools(id,name,school_code)').eq('user_id',user.id).eq('active',true);
 if(error){notify('Could not load school access: '+error.message,true);return}
 const sel=$('schoolSelect');sel.innerHTML='<option value="">Select school</option>';
 (members||[]).forEach(m=>{if(m.schools){const o=document.createElement('option');o.value=m.school_id;o.textContent=m.schools.name+' ('+m.role+')';o.dataset.role=m.role;sel.append(o)}});
 if(sel.options.length===2){sel.selectedIndex=1;await selectSchool()}
 else if(sel.options.length===1){notify('Your account is signed in, but no active school membership was found. Ask a school administrator to create the school and assign your account.',true)}
}
async function selectSchool(){
 schoolId=$('schoolSelect').value;role=$('schoolSelect').selectedOptions[0]?.dataset.role||'';
 if(!schoolId)return;$('userRole').textContent=role.replace('_',' ');$('roleCount').textContent=role.replace('_',' ');$('settingsRole').textContent=role;
 await Promise.all([loadStudents(),loadAssessments(),loadStats()]);
}
async function loadStudents(){
 const {data,error}=await db.from('student_enrollments').select('student_id,class_id,stream_id,is_current,students(id,admission_number,first_name,last_name,other_names,sex,status),classes(name),streams(name)').eq('school_id',schoolId).eq('is_current',true);
 if(error){notify('Student list: '+error.message,true);return}
 students=(data||[]).map(x=>({...x.student,...{class_name:x.classes?.name||'',stream_name:x.streams?.name||''}})).filter(Boolean);
 renderStudents();const rs=$('reportStudent');rs.innerHTML='<option value="">Choose learner</option>'+students.map(s=>`<option value="${s.id}">${esc(s.admission_number)} — ${esc(s.first_name)} ${esc(s.last_name)}</option>`).join('');
}
function renderStudents(){
 const q=($('studentSearch').value||'').toLowerCase();
 const rows=students.filter(s=>(`${s.first_name} ${s.last_name} ${s.admission_number}`).toLowerCase().includes(q));
 $('studentsBody').innerHTML=rows.length?rows.map(s=>`<tr><td>${esc(s.admission_number)}</td><td><strong>${esc(s.first_name)} ${esc(s.last_name)} ${esc(s.other_names||'')}</strong></td><td>${esc(s.sex||'—')}</td><td>${esc(s.class_name)}</td><td>${esc(s.stream_name)}</td><td>${esc(s.status||'active')}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No current learners found.</td></tr>';
}
async function loadAssessments(){
 const {data,error}=await db.from('assessments').select('id,title,max_score,assessment_date,status,classes(name),subjects(name),terms(name),academic_years(name)').eq('school_id',schoolId).order('assessment_date',{ascending:false});
 if(error){notify('Assessments: '+error.message,true);return}assessments=data||[];
 $('assessmentSelect').innerHTML='<option value="">Choose assessment</option>'+assessments.map(a=>`<option value="${a.id}">${esc(a.title)} — ${esc(a.subjects?.name||'Subject')}</option>`).join('');
}
async function loadStats(){
 const {count:s}=await db.from('students').select('*',{count:'exact',head:true}).eq('school_id',schoolId);
 const {count:a}=await db.from('assessments').select('*',{count:'exact',head:true}).eq('school_id',schoolId);
 const {count:m}=await db.from('marks').select('*',{count:'exact',head:true}).eq('school_id',schoolId);
 $('studentCount').textContent=s??0;$('assessmentCount').textContent=a??0;$('marksCount').textContent=m??0;
}
async function loadMarkSheet(){
 const id=$('assessmentSelect').value;currentAssessment=assessments.find(a=>a.id===id);if(!currentAssessment){notify('Choose an assessment first.',true);return}
 const {data:existing,error}=await db.from('marks').select('student_id,score,comment').eq('school_id',schoolId).eq('assessment_id',id);
 if(error){notify('Could not load marks: '+error.message,true);return}
 const map=new Map((existing||[]).map(m=>[m.student_id,m]));
 const list=students.filter(s=>!currentAssessment.classes?.name||s.class_name===currentAssessment.classes.name);
 $('assessmentMeta').textContent=`${currentAssessment.subjects?.name||'Subject'} · ${currentAssessment.classes?.name||'Class'} · Maximum score ${currentAssessment.max_score} · ${currentAssessment.status}`;
 $('marksBody').innerHTML=list.length?list.map(s=>{const m=map.get(s.id)||{};return `<tr data-student="${s.id}"><td>${esc(s.admission_number)}</td><td>${esc(s.first_name)} ${esc(s.last_name)}</td><td><input class="score-input" type="number" min="0" max="${Number(currentAssessment.max_score)}" step="0.01" value="${m.score??''}" aria-label="Score"></td><td><input class="comment-input" value="${esc(m.comment||'')}" aria-label="Comment"></td></tr>`}).join(''):'<tr><td colspan="4" class="empty">No enrolled learners match this class.</td></tr>';
 $('saveMarks').disabled=!list.length;clearNotice();
}
async function saveMarkSheet(){
 if(!currentAssessment)return;const rows=[...$('marksBody').querySelectorAll('tr[data-student]')],payload=[];
 for(const row of rows){const scoreText=row.querySelector('.score-input').value;if(scoreText==='')continue;const score=Number(scoreText);if(!Number.isFinite(score)||score<0||score>Number(currentAssessment.max_score)){notify('Enter scores between 0 and '+currentAssessment.max_score+'.',true);return}
 payload.push({school_id:schoolId,assessment_id:currentAssessment.id,student_id:row.dataset.student,score,comment:row.querySelector('.comment-input').value||null,entered_by:user.id})}
 if(!payload.length){notify('No scores entered to save.',true);return}
 $('saveMarks').disabled=true;$('saveStatus').textContent='Saving…';
 const {error}=await db.from('marks').upsert(payload,{onConflict:'assessment_id,student_id'});
 $('saveMarks').disabled=false;$('saveStatus').textContent=error?'Save failed':'Saved';
 if(error)notify('Save failed: '+error.message,true);else{notify(`${payload.length} mark(s) saved successfully.`);await loadStats()}
}
async function generateReport(){
 const sid=$('reportStudent').value;if(!sid){notify('Choose a learner first.',true);return}
 const student=students.find(s=>s.id===sid);const {data,error}=await db.from('marks').select('score,comment,assessments(title,max_score,assessment_date,subjects(name),terms(name))').eq('school_id',schoolId).eq('student_id',sid);
 if(error){notify('Could not generate report: '+error.message,true);return}
 const rows=data||[];const total=rows.reduce((n,x)=>n+Number(x.score||0),0),max=rows.reduce((n,x)=>n+Number(x.assessments?.max_score||0),0),pct=max?100*total/max:0;
 $('reportOutput').innerHTML=`<div class="report-sheet"><h2>${esc($('schoolSelect').selectedOptions[0]?.textContent||'School')}</h2><h3>LEARNER PERFORMANCE REPORT</h3><p style="text-align:center">BENTECH School Report Management System</p><hr><p><b>Learner:</b> ${esc(student.first_name)} ${esc(student.last_name)} &nbsp; <b>Admission No.:</b> ${esc(student.admission_number)}</p><p><b>Class:</b> ${esc(student.class_name)} &nbsp; <b>Stream:</b> ${esc(student.stream_name)}</p><table><thead><tr><th>Assessment</th><th>Subject</th><th>Term</th><th>Score</th><th>Out of</th><th>Percentage</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.assessments?.title)}</td><td>${esc(x.assessments?.subjects?.name)}</td><td>${esc(x.assessments?.terms?.name||'—')}</td><td>${Number(x.score).toFixed(1)}</td><td>${Number(x.assessments?.max_score).toFixed(1)}</td><td>${(100*Number(x.score)/Number(x.assessments?.max_score||1)).toFixed(1)}%</td></tr>`).join('')}</tbody></table><p><b>Overall:</b> ${total.toFixed(1)} / ${max.toFixed(1)} (${pct.toFixed(1)}%)</p><p><b>Teacher's comment:</b> ___________________________________________</p><p style="margin-top:35px">Class Teacher: ____________________ &nbsp;&nbsp; Headteacher: ____________________</p><button class="primary" onclick="window.print()">Print report</button></div>`;
}
$('authForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});if(error)notify(error.message,true);else await refreshSession()});
$('signupBtn').addEventListener('click',async()=>{const email=$('email').value,password=$('password').value;if(!email||password.length<6){notify('Enter an email and a password of at least 6 characters first.',true);return}const {error}=await db.auth.signUp({email,password});if(error)notify(error.message,true);else notify('Account created. Check your email if confirmation is enabled. A school administrator must assign your school access.')});
$('logoutBtn').addEventListener('click',async()=>{await db.auth.signOut();location.reload()});
$('schoolSelect').addEventListener('change',selectSchool);$('studentSearch').addEventListener('input',renderStudents);$('loadMarks').addEventListener('click',loadMarkSheet);$('saveMarks').addEventListener('click',saveMarkSheet);$('generateReport').addEventListener('click',generateReport);
document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
$('year').textContent=new Date().getFullYear();showView('overview');refreshSession();
