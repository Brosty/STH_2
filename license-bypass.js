(function(window){
  'use strict';
  // Safe define flag helper
  function forceTrueFlag(obj, key){
    try{
      var desc = Object.getOwnPropertyDescriptor(obj, key);
      if(!desc){
        Object.defineProperty(obj, key, {value:true, configurable:true, enumerable:true, writable:true});
        return;
      }
      if(desc.set){
        try{ obj[key] = true; }catch(e){}
        return;
      }
      if(desc.writable){
        try{ obj[key] = true; }catch(e){}
        return;
      }
      // non-writable getter-only: redefine if configurable
      if(desc.configurable){
        try{ Object.defineProperty(obj, key, {get:function(){return true;}});}catch(e){}
        return;
      }
      // fallback: proxy wrap
      // no-op here; callers should read via safeGet
    }catch(e){}
  }
  function safeSetFlags(target){
    if(!target || typeof target!=='object') return target;
    ['isPay','isPayS','premium','start','active','licensed'].forEach(function(k){forceTrueFlag(target,k)});
    return target;
  }
  function safeGetFlag(obj, key){
    try{ return !!obj[key]; }catch(e){ return true; }
  }

  console.log('Enhanced Steam Trader Helper License Bypass loading...');

  var originalXHR = window.XMLHttpRequest;
  var originalFetch = window.fetch;

  function CustomXHR(){
    var xhr = new originalXHR();
    var intercepted = false; var url='';
    var _open = xhr.open; xhr.open = function(m,u,a,u1,pw){ url=u; 
      if(u && (u.indexOf('steamtraderhelper.com')>-1 || u.indexOf('float.steamtraderhelper.com')>-1)){
        intercepted = true;
        Object.defineProperty(this,'readyState',{value:4,writable:true});
        Object.defineProperty(this,'status',{value:200,writable:true});
        Object.defineProperty(this,'statusText',{value:'OK',writable:true});
        Object.defineProperty(this,'responseText',{value: JSON.stringify([0.5]), writable:true});
        Object.defineProperty(this,'response',{value: JSON.stringify([0.5]), writable:true});
        return; }
      return _open.apply(this, arguments);
    };
    var _send = xhr.send; xhr.send = function(d){ if(intercepted){ var self=this; setTimeout(function(){ self.onreadystatechange && self.onreadystatechange(); self.onload && self.onload(); },10); return; } return _send.apply(this, arguments); };
    var _set = xhr.setRequestHeader; xhr.setRequestHeader = function(h,v){ if(intercepted) return; return _set.apply(this, arguments); };
    return xhr;
  }
  window.XMLHttpRequest = CustomXHR;
  window.fetch = function(res, opt){ var u = typeof res==='string'?res:res.url; if(u && (u.indexOf('steamtraderhelper.com')>-1 || u.indexOf('float.steamtraderhelper.com')>-1)){ return Promise.resolve({ok:true,status:200,statusText:'OK', json:function(){return Promise.resolve([0.5])}, text:function(){return Promise.resolve(JSON.stringify([0.5]))}});} return originalFetch.apply(this, arguments); };

  function hookSTH(){
    if(typeof window.STH === 'function' && !hookSTH._done){
      console.log('License Bypass: Hooking STH object');
      hookSTH._done = true;
      var orig = window.STH;
      window.STH = function(){ var res = orig.apply(this, arguments); if(res && typeof res==='object'){ safeSetFlags(res);
        if(typeof res.authS==='function'){ var oa = res.authS; res.authS = function(){ var a = oa.apply(this, arguments) || {}; safeSetFlags(a); if(!a.sessionID) a.sessionID='dummy'; if(!a.currency) a.currency=1; return a;}; }
        if(typeof res.auth==='function'){ var ob = res.auth; res.auth = function(){ var a = ob.apply(this, arguments) || {}; safeSetFlags(a); if(!a.t) a.t='premium_token'; return a;}; }
      }
      return res; };
      // copy props
      for(var k in orig){ try{ if(Object.prototype.hasOwnProperty.call(orig,k)) window.STH[k]=orig[k]; }catch(e){} }
    }
  }
  hookSTH(); var iv = setInterval(hookSTH, 200); setTimeout(function(){ clearInterval(iv); }, 15000);

  window.addEventListener('load', function(){ console.log("Enhanced License Bypass initialized - all premium features should be unlocked"); });

  // Periodically enforce flags on STH('data') result without direct write to readonly
  setInterval(function(){ try{ if(typeof window.STH==='function'){ var d = window.STH('data'); if(d && typeof d==='object'){ safeSetFlags(d); } } }catch(e){} }, 1200);

})(window);
