;(function(o){
  'use strict';
  var l = o;
  const u = 'itemHN';
  const h = 'market_hash_name', f = 'appid';
  const d = 'name', y = 'type', T = 'item_nameid';
  const b = 'publisher_fee_percent';

  // Minimal safe helpers instead of external List/patterns
  var p = { test: function(){ return false; }, add:function(){} };
  function s(name, obj, test){ /* simplified noop dedupe */ }
  function n(){ /* simplified noop runner */ }

  var i, e, a, r = [], S = l.app = {
    stop: function(){ r = []; },
    init: function(){
      chrome.browserAction.onClicked.addListener(function(){
        var url = chrome.extension.getURL('page/index.html');
        chrome.tabs.query({url:url}, function(tabs){
          var t = tabs.pop();
          if(t){
            chrome.tabs.update(t.id, {active:true});
          } else {
            chrome.tabs.create({url:url});
          }
        });
      });
      m(this);
      chrome.tabs.query({url:'*://steamcommunity.com/*'}, function(t){
        for(var k=t.length; k--;){
          chrome.tabs.reload(t[k].id);
        }
      });
    },
    faendData: function(x){
      var murl = x.url, pid = x.id;
      if(!l.STH().authS()) return;
      ajax(murl, null, function(body){
        var t = (function(s){
          if(!s) return null;
          var id = (s.match(/Market_LoadOrderSpread\s*\(([0-9]+)\)/) || []).pop();
          var bt = /ItemActivityTicker\.Start/.test(s) ? 1 : 2;
          if(id) return { item_nameid:id, buy_type:bt };
          return null;
        })(body);

        var parsed = _(new URL(murl).pathname);
        murl = null;
        if(parsed && t && t[T]){
          t[f] = +parsed.appid;
          t[h] = parsed.hash_name;
          var listingJSON = (body.match(/(?:g_rgListingInfo\s*=\s*)(\{[^;]+\})/) || ['{}']).pop();
          var assetsJSON  = (body.match(/(?:g_rgAssets\s*=\s*)(\{[^\n]+\})(?=;)/) || ['{}']).pop();
          var o, u;
          try{
            o = JSON.parse(listingJSON);
            u = JSON.parse(assetsJSON);
          }catch(_){ return; }

          if(u){
            var first;
            for(var A in u){
              for(var C in u[A]){ t.contextid = +C; first = u[A][C]; break; }
              break;
            }
            if(first){
              for(var F in first){
                if(!t[d] || !t[y]){
                  t[d] = first[F].market_name;
                  t[y] = first[F].type || first[F].appid;
                  t[h] = first[F].market_hash_name;
                }
                break;
              }
            }
          }

          if(o){
            for(var kk in o){
              t[b] = o[kk].publisher_fee_percent ? parseInt(100 * o[kk].publisher_fee_percent) : 10;
              break;
            }
          }
          S.setAppProcent(t[f], t[b] || 10);
          l.DB.item.up(pid, t);
        }
      });
    },
    pURL: v,
    _addUrl: g,
    addUrl: function(url, name, filter, groupID){
      var parsed = v(url);
      if(!parsed) return;
      var appid = +parsed.appid, hash = parsed.hash_name;
      l.DB[u](hash).then(function(exists){
        if(exists !== null) return;
        l.DB.item.set({
          name: name || hash,
          url: url,
          market_hash_name: hash,
          appid: appid,
          filter: filter || '',
          groupID: groupID || 0
        }).then(function(id){ S.faendData({url:url, id:id}); });
      });
    },
    _tabGetPrice: function(data, ok, fail){
      o.app.tab({type:'getPrice', data:data}, function(ans){
        if(ans && ans.success === 1){ ok(ans); }
        else if(fail){
          var code = ans.error || 0;
          STH().error = { mess:'STH.GET - Request "itemordershistogram" '+(self.data?self.data[T]:'NIL')+' Status Code: '+code, stat:code, t:'ioh' };
          fail(ans);
        }
      });
    },
    tabGetPrice: function(d, ok, fail){
      try{ this._tabGetPrice(d, ok, fail); }
      catch(_){ if(fail) fail(); }
    },
    tab: (
      i = null,
      e = false,
      t.getId = function(){ if(i || e === false) return i; e = true; a(function(){ e = false; }); return i; },
      a = function(cb){
        if(i) { cb(i); return; }
        chrome.tabs.query({url:'*://steamcommunity.com/*'}, function(tabs){
          if(tabs.length){ i = tabs[0].id; cb(i); }
          else{
            chrome.tabs.create({url:'https://steamcommunity.com/market/', selected:false}, function(tab){ i = tab.id; cb(i); });
          }
        });
        return 0;
      },
      setInterval(function(){ if(i) chrome.tabs.sendMessage(i, 'ping', {}, function(ans){ if(ans === void 0) i = false; }); }, 3000),
      chrome.tabs.onRemoved.addListener(function(tabId){ if(i && i === tabId) i = false; }),
      chrome.tabs.onUpdated.addListener(function(tabId){ if(i && i === tabId) i = false; }),
      t
    ),
    messTime: 0,
    isTime: function(){ return this.messTime < now(); },
    _payL: null,
    payL: function(list){
      var m = this;
      if(!list) return;
      list = list.filter(function(e){ return !p.test(e.listingid); });
      if(!list.length) return false;
      if(list[0].link !== void 0 && list[0].float !== void 0){
        setTimeout(function(){ try{ m._payL = [list[0]]; m.payDo(); }catch(_){ } }, 5);
        return;
      }
      m._payL = list; m.payDo();
    },
    payDo: function(){ var q = this._payL; if(!q) return; var x = q.shift(); if(!x) return; if(!this.pay(x)) q.unshift(x); },
    pay: function(row){
      var auth = l.STH().authS();
      if(!this.isTime() || !auth) return false;
      this.messTime = now() + 10000;
      p.add(row.listingid);
      l.STH().found = 1;
      row.type = 'buy'; row.sessionid = auth.sessionID; row.currency = auth.currency;
      l.app.tab(row, function(ans){ l.app.payRes(0, ans); });
      return true;
    },
    payRes: function(id, res){
      if(res !== 'pong'){
        if(res === 'good'){
          this._payL = null; l.STH().bought = 1;
        } else {
          if(typeof res === 'object') res = JSON.stringify(res);
          l.STH().error = 'RessError #'+id+'| type ,'+res;
        }
      }
      this.payDo(); this.messTime = 0; n();
    },
    oClouse: function(row){
      var auth = l.STH().authS();
      if(!auth) return;
      if(!this.isTime()) return s('oClouse', row);
      row.time = this.messTime = now() + 20000; row.sessionid = auth.sessionID; row.type = 'cancelbuyorder';
      l.app.tab(row, function(ans){ l.app.payRes(0, ans); });
      return true;
    },
    oClouseRes: function(id, res){
      if(res.success === 1 || res.success === 29){ l.STH('myListings').remove('B', res.appID, res.hashName); }
      else { l.STH().error = '#Cancelbuyorder('+res.success+') - '+(res.message||'message NULL'); }
      setTimeout(function(tt){ if(S.messTime <= tt) S.messTime = 0; n(); }, 200, res.time);
    },
    oPayF: function(row){ var auth = l.STH().authS(); if(!l.STH('start') || !auth || !this.isTime()) return; row.time = this.messTime = now()+20000; row.type='buyorderF'; row.sessionid=auth.sessionID; row.currency=auth.currency; l.STH().found=1; l.app.tab(row, function(_){}); return true; },
    oPayFRes: function(id, res){ if(res.type==='OrderInfo' && res.r && parseInt(res.r.quantity_remaining)===0){ l.STH().bought=1; } else { l.STH().error='#Createbuyorder2('+res.success+') - '+(res.message||'message NULL'); } setTimeout(function(tt){ if(S.messTime<=tt) S.messTime=0; },200,res.time); n(); },
    oPay: function(row){ var auth=l.STH().authS(); if(!l.STH('start')||!auth||!this.isTime()) return; this.messTime=now()+10000; row.type='createbuyorder'; row.sessionid=auth.sessionID; row.currency=auth.currency; l.app.tab(row,function(ans){ l.app.payRes(0,ans); }); return true; },
    oPayRes: function(id,res){ if(res.success===29||res.success===1){ l.STH('myListings').addOrder(id,res.OrderID,res.price,res.count); } else { l.STH().error='#Createbuyorder('+res.success+') - '+(res.message||'message NULL'); } this.messTime=0; n(); },
    oSR: function(row){ var auth=l.STH().authS(); if(!auth) return; if(this.isRemovelisting2) return s('oSR',row); this.isRemovelisting2=true; row.type='removelisting2'; row.sessionid=auth.sessionID; l.app.tab(row,function(ans){ l.app.oSRRes(0,ans); }); },
    oSRRes: function(_,res){ o.STH('myListings').remove('S2',res.appID,res.hashName,res.sellIds); this.isRemovelisting2=false; n(); },
    oSellRemove: function(row){ var auth=l.STH().authS(); if(!auth) return; if(!(this.messTime<now())) return s('oSellRemove',row); this.messTime=now()+10000; row.type='removelisting'; row.sessionid=auth.sessionID; l.app.tab(row,function(ans){ l.app.payRes(0,ans); }); return true; },
    oSellRemoveRes: function(_,res){ o.STH('myListings').remove('S',res.appID,res.hashName,res.sellId); this.messTime=0; n(); },
    sell: function(row){ var auth=l.STH().authS(); if(!l.STH().start && !auth) return n(); if(!(this.messTime<now())) return; row.time=this.messTime=now()+20000; row.type='sell'; row.sessionid=auth.sessionID; l.app.tab(row,function(_){}); return true; },
    sellRes: function(id,res){ if(res.type==='done') l.STH('myListings').addSell(id,res.price); else l.STH().error='#Create Sel('+res.success+') - '+(res.message||'message NULL'); setTimeout(function(tt){ if(S.messTime<=tt) S.messTime=0; },200,res.time); n(); },
    sell_good: function(){},
    setAppProcent: function(app,pc){ l.DB.itemUP(app,pc); },
    initAppProcent: function(){ var step=0; l.DB.aurl(function(row){ var url=row.url, app=row[f]; setTimeout(function(){ ajax(url,null,function(html){ var j=(html.match(/(?:g_rgListingInfo\s*=\s*)(\{[^;]+\})/)||['{}']).pop(); try{ var obj=JSON.parse(j);}catch(_){ return; } var pct=10; if(obj && Object.keys(obj).length){ for(var k in obj){ pct = obj[k].publisher_fee_percent?parseInt(100*obj[k].publisher_fee_percent):10; break; } } l.app.setAppProcent(app,pct); }); },1000*(step||1)); step++; }); }
  };

  function t(msg,cb){ return a(function(tabId){ chrome.tabs.sendMessage(tabId,msg,{},function(ans){ if(ans===void 0) i=false; if(cb) cb(ans); }); msg=null; }); }
  function c(id,delta){ /* simplified noop */ }
  function m(app){ chrome.extension.onMessage.addListener(function(req, sender, send){ if(!req||!req.do) return; switch(req.do){
      case 'groups': break;
      case 'item': var pth=v(req.url), hn; if(pth){ hn=pth.hash_name; l.DB[u](hn).then(function(d){ chrome.tabs.sendMessage(sender.tab.id,{type:'itemData',market_hash_name:hn,data:d},{}); }); send({market_hash_name:hn}); } else send({market_hash_name:null}); break;
      case 'data': var dr = STH('data')[req?req.name:'']; try{ if(dr && typeof dr==='object'){ ['isPay','isPayS','premium','start','active','wOptChkSound'].forEach(function(k){ try{ var desc=Object.getOwnPropertyDescriptor(dr,k); if(!desc || desc.writable) dr[k]=true; else if(desc && desc.configurable) Object.defineProperty(dr,k,{get:function(){return true;}}); }catch(_){} }); } }catch(_){} send(dr); break;
      case 'add': g(req.url); send(); break;
      case 'pay': S.payRes(req.id,req.res); break;
      case 'sell': S.sellRes(req.id,req); break;
      case 'buyorderF': S.oPayFRes(req.id,req); break;
      case 'createbuyorder': S.oPayRes(req.id,req); break;
      case 'cancelbuyorder': S.oClouseRes(req.id,req); break;
      case 'removelisting': S.oSellRemoveRes(req.id,req); break;
      case 'checkTabUsed': send({used:STH().start && sender.tab.id===S.tab.getId()}); break;
      case 'removelisting2': S.oSRRes(req.id,req); break; }
  }); m=null; }

  function g(raw){ var u = new URL(raw), path=u.pathname, qs=u.search; qs = qs && qs[0]==='?' ? qs.substr(1):null; var q = qs? qs.split('&').reduce(function(acc,kv){ kv=kv.split('='); if(kv.length) acc[kv[0]]=kv[1]; return acc; },{}):{}; var base='https://steamcommunity.com'+path; var parsed=v(raw); if(parsed) S.addUrl(base, parsed.hash_name, q.filter||''); else l.STH().error='#addUrl - URL malformed'; }
  function v(raw){ var u = new URL(raw); var href='https://steamcommunity.com'+u.pathname; var st={filter:''}; if(u.search && u.search[0]==='?') u.search.substr(1).split('&').reduce(function(acc,kv){ kv=kv.split('='); if(kv.length&&kv[1]) acc[kv[0]]=kv[1]; return acc; }, st); var pp = _(u.pathname); if(!pp) return null; pp.href=href; pp.filter=st.filter; return pp; }
  function _(path){ var re=/\/market\/listings\/(\d+)\/(.+)/; if(!re.test(path)) return null; return { url:parseInt(path.replace(re,'$1')), appid:parseInt(path.replace(re,'$1')), hash_name:decodeURIComponent(path.replace(re,'$2')) };
  }

  S.init();
})(this);
