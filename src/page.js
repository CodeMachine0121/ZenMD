/*
 * The form navigates to Buttondown, which answers with a verification page the
 * reader has to click. That step cannot be hidden — posting into an invisible
 * frame swallows it, and the page then claims a success that never happened.
 * So all this does is stop a second submit while the first one is leaving.
 */
(function () {
  var form = document.getElementById('waitlist');
  var state = document.getElementById('formstate');
  if (!form || !state) return;

  form.addEventListener('submit', function () {
    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    state.hidden = false;
    state.className = 'formstate';
    state.textContent = '{{formSending}}';
  });
})();
