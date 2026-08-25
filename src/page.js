/*
   * The form posts into a hidden frame instead of navigating away, so the
   * reader stays on the page. We cannot read that frame (different origin),
   * so a load after a submit is all the confirmation available -- which is
   * why the wording says "收到了" rather than claiming it succeeded.
   * With scripting off the form still posts; it just lands on Buttondown's
   * own confirmation page.
   */
  (function () {
    var form = document.getElementById('waitlist');
    var sink = document.getElementById('bd-sink');
    var state = document.getElementById('formstate');
    if (!form || !sink || !state) return;

    var submitted = false;
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function () {
      submitted = true;
      state.hidden = false;
      state.className = 'formstate';
      state.textContent = '{{formSending}}';
    });

    sink.addEventListener('load', function () {
      if (!submitted) return; // the frame also loads once with the page itself
      state.className = 'formstate formstate--done';
      state.textContent = '{{formDone}}';
      if (button) button.disabled = true;
    });
  })();
