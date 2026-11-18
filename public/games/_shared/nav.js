/* Back-button support for every game.
   Hub -> game page -> (play) : Back from play returns to the game's menu/level map,
   Back again returns to the hub, Back again returns to whatever page the visitor came from. */
(function(){
  var inPlay=false, onBack=null, skip=0;
  var G=window.GNav={
    enter:function(cb){ onBack=cb; if(inPlay)return; inPlay=true; try{history.pushState({gnav:1},'')}catch(e){} },
    leave:function(){ if(!inPlay)return; inPlay=false; skip++; try{history.back()}catch(e){skip--} },
    get playing(){return inPlay}
  };
  addEventListener('popstate',function(){
    if(skip>0){skip--;return}
    if(inPlay){ inPlay=false; var f=onBack; if(f)try{f()}catch(e){} }
  });
  // Brand/home links: if we came from the hub, go Back (no duplicate history entries); else normal navigation.
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href="/"]'); if(!a)return;
    var fromHub=false; try{var r=new URL(document.referrer); fromHub=r.origin===location.origin&&r.pathname==='/'}catch(_){}
    if(fromHub&&history.length>1){ e.preventDefault(); history.go(inPlay?-2:-1); }
  },true);
})();
