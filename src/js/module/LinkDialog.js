define([
  'summernote/core/key'
], function (key) {
  var LinkDialog = function (handler) {

    /**
     * toggle button status
     *
     * @private
     * @param {jQuery} $btn
     * @param {Boolean} isEnable
     */
    var toggleBtn = function ($btn, isEnable) {
      $btn.toggleClass('disabled', !isEnable);
      $btn.attr('disabled', !isEnable);
    };

    /**
     * bind enter key
     *
     * @private
     * @param {jQuery} $input
     * @param {jQuery} $btn
     */
    var bindEnterKey = function ($input, $btn) {
      $input.on('keypress', function (event) {
        if (event.keyCode === key.code.ENTER) {
          $btn.trigger('click');
        }
      });
    };

    /**
     * Show link dialog and set event handlers on dialog controls.
     *
     * @param {jQuery} $editable
     * @param {jQuery} $dialog
     * @param {Object} linkInfo
     * @return {Promise}
     */
    this.showLinkDialog = function ($editable, $dialog, linkInfo) {
      return $.Deferred(function (deferred) {
        var $linkDialog = $dialog.find('.note-link-dialog').clone();

        $('body').append($linkDialog);

        var $linkText = $linkDialog.find('.note-link-text'),
        $linkUrl = $linkDialog.find('.note-link-url'),
        $linkBtn = $linkDialog.find('.note-link-btn'),
        $openInNewWindow = $linkDialog.find('input[type=checkbox]');

        $linkDialog.one('shown.bs.modal', function () {
          $linkText.val(linkInfo.text);

          $linkText.on('input', function () {
            toggleBtn($linkBtn, $linkText.val() && $linkUrl.val());
            // if linktext was modified by keyup,
            // stop cloning text from linkUrl
            linkInfo.text = $linkText.val();
          });

          // if no url was given, copy text to url
          if (!linkInfo.url) {
            linkInfo.url = linkInfo.text || 'http://';
            toggleBtn($linkBtn, linkInfo.text);
          }

          $linkUrl.on('input', function () {
            toggleBtn($linkBtn, $linkText.val() && $linkUrl.val());
            // display same link on `Text to display` input
            // when create a new link
            if (!linkInfo.text) {
              $linkText.val($linkUrl.val());
            }
          }).val(linkInfo.url).trigger('focus').trigger('select');

          bindEnterKey($linkUrl, $linkBtn);
          bindEnterKey($linkText, $linkBtn);

          $openInNewWindow.prop('checked', linkInfo.newWindow);

          $linkBtn.one('click', function (event) {
            event.preventDefault();

            deferred.resolve({
              range: linkInfo.range,
              url: $linkUrl.val(),
              text: $linkText.val(),
              newWindow: $openInNewWindow.is(':checked')
            });
            $linkDialog.modal('hide');
          });

          $linkDialog.find('.close').click(function (event) {
            event.preventDefault();
            $linkDialog.modal('hide');
          });
        }).one('hidden.bs.modal', function () {
          // detach events
          $linkText.off('input keypress');
          $linkUrl.off('input keypress');
          $linkBtn.off('click');

          if (deferred.state() === 'pending') {
            deferred.reject();
          }
          $linkDialog.remove();
        }).modal('show');

        // used for dialog stack
        if ($('.modal-backdrop').length > 1) {
          var $maskLast = $('.modal-backdrop:last'), idx = $maskLast.css('z-index');
          $maskLast.css('z-index', parseInt(idx, 10) + 20);
          var $dialogLast = $('.modal:last'), didx = $dialogLast.css('z-index');
          $dialogLast.css('z-index', parseInt(didx, 10) + 20);
        }
      }).promise();
    };

    /**
     * @param {Object} layoutInfo
     */
    this.show = function (layoutInfo) {
      var $editor = layoutInfo.editor(),
          $dialog = layoutInfo.dialog(),
          $editable = layoutInfo.editable(),
          $popover = layoutInfo.popover(),
          linkInfo = handler.invoke('editor.getLinkInfo', $editable);

      var options = $editor.data('options');

      handler.invoke('editor.saveRange', $editable);
      this.showLinkDialog($editable, $dialog, linkInfo).then(function (linkInfo) {
        handler.invoke('editor.restoreRange', $editable);
        handler.invoke('editor.createLink', $editable, linkInfo, options);
        // hide popover after creating link
        handler.invoke('popover.hide', $popover);
      }).fail(function () {
        handler.invoke('editor.restoreRange', $editable);
      });
    };
  };

  return LinkDialog;
});
