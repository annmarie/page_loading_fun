
(function(win, doc, callback) {
  var _fetch = win.fetch,
  open = win.XMLHttpRequest.prototype.open,
  send = win.XMLHttpRequest.prototype.send,
  inProgressFetchCnt = 0,
  inProgressXhrCnt = 0,
  foundTerms = [];

  listenToFetch(); // keeps a count of current fetch process
  listenToXhr(); // keep a count of current xhr process
  listenToMutations(); // parse dom changes

      // THOUGHTS
      // ignore ajax calls to well known analytics sites

  var checkPageLoadingStatus = function(){
    if ((inProgressXhrCnt < 1) && (inProgressFetchCnt < 1)) {
      callback();
    } else {
      setTimeout(checkPageLoadingStatus, 100);
    }
  }
  // wait a sec before starting
  setTimeout(checkPageLoadingStatus, 1000);


  function listenToFetch() {
    window.fetch = function(url) {
      inProgressFetchCnt += 1;
      return _fetch(url)
        .then(function(resp) {
          return Promise.resolve(resp)
        })
        .catch(function(err) {
          return Promise.reject(err)
        })
        .finally(function() {
          inProgressFetchCnt -= 1;
        });
    }
  }

  function listenToXhr() {
    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
      this.addEventListener('readystatechange', function() {
        switch (this.readyState) {

          case XMLHttpRequest.OPENED:
            inProgressXhrCnt += 1;
            break

          case XMLHttpRequest.DONE:
            inProgressXhrCnt -= 1;
            break
        }
      }, false)

      open.call(this, method, url, async, user, pass)
    }

    // more stuff to listen too
    XMLHttpRequest.prototype.send = function(data) {
      send.call(this, data);
    }
  }

  // -- Unfinished --
  // THOUGHTS
  // try to related dom events with api calls
  // figure out a way to filter out noise (ex. a looping animiation on the page)
  function listenToMutations() {
    // not an elegant solution as this dictionary would have to be maintained
    // a lot more work would be needed to find all the key terms
    var terms = ['spin', 'load', 'transition']
    var findMutations = function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type == 'attributes') return;
        terms.map(function(val){
          if (mutation.target.querySelectorAll("[class^="+ val +"]")) {
            foundTerms.push(val);
          }
        });
     })
   },
   observer = new MutationObserver(findMutations);

   observer.observe(
     doc.body,
     { attributes: true,
       characterData: true,
       childList: true,
       subtree: true,
       attributeOldValue: true,
       characterDataOldValue: true }
   );
  }
})(window, document, function(){
  console.log("--- i am the didPageFinishLoading callback ---");
})
