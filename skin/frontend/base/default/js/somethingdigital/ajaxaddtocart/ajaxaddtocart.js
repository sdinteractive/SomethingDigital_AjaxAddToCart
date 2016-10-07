'use strict';

(function($){
    var getDefaultErrorHtml = function() {
      return '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error"><span>' +
        Translator.translate('Please check your network connection and try again.') +
        '</span></li></ul></li></li></ul>';
    };

    window.sdAjaxaddtocart = {
        init:function(productAddToCartForm, options) {

            var settings = $.extend({
                scroll: false,
                scrollDuration: 250,
                triggerPopup: true,
                popupDuration: 0, // 0 means infinite -- for accessibility concerns. USe 1+ for specific duration
                popupTrackFocus: true,
                triggerMinicart: true,
                triggerLoadingModal: true
            }, options);

            var $body = $('body');

            productAddToCartForm.submit = productAddToCartForm.submit.wrap(function($super, button, url) {
                var form   = this.form;
                var oldUrl = form.action;
                var e      = null;
                var args   = {button: button, url: url, form: form};
                var weHaveALoadingModal = typeof loadingModal !== 'undefined'; // check if site has a loadingModal

                if (this.validator.validate()) {
                    $body.addClass('locked');

                    // Fire submit event on submit -- useful for custom loaders
                    $(document).trigger("sd_ajaxaddtocart:submit", [args]);

                    if (weHaveALoadingModal && settings.triggerLoadingModal) {
                      loadingModal.show();
                    }

                    try {
                        $.ajax({
                            url: form.action,
                            dataType: 'json',
                            type: 'post',
                            data: form.serialize()
                        })
                            .done(function(data){
                                var $updatedCart   = $(data.minicart_head);
                                var headerCartHtml = $updatedCart.find('#header-cart').html();
                                var skipCartHtml   = $updatedCart.find('.skip-cart').html();

                                var $notificationTemplate = $('#sd-ajax-add-to-cart___pop-up--template').children();
                                var $notificationShowcase = $('#sd-ajax-add-to-cart___pop-up--showcase');

                                // Do we need to update the product form's action?
                                // This allows one to continue configuring, for example.
                                if (data.product_addtocart_form_action) {
                                    $(form).prop('action', data.product_addtocart_form_action);
                                }

                                $body.removeClass('locked');

                                // If add to cart from quickview, close quickview
                                if (typeof(window.sdQuickview) != "undefined"
                                    && $('#sd-quickview').is(':visible')) {
                                    window.sdQuickview.close();
                                }

                                if(settings.scroll) {
                                    $('html,body').animate({scrollTop: 0}, settings.scrollDuration);
                                }

                                //apply the minicart update and unfurl it
                                $('#header-cart').html(headerCartHtml);

                                var $cartLink = $('.skip-cart');
                                $cartLink.html(skipCartHtml);
                                if ($updatedCart.find('.skip-cart').hasClass('no-count')) {
                                    $cartLink.addClass('no-count');
                                } else {
                                    $cartLink.removeClass('no-count');
                                }

                                if (settings.triggerMinicart) {
                                    $cartLink.trigger('click');
                                }

                                // Fire success event on success and pass through data returned from response
                                $(document).trigger("sd_ajaxaddtocart:success", [data, args]);

                                // Show our popup
                                if (!settings.scroll && settings.triggerPopup) {
                                  // Close minicart
                                  $('#header-cart__link').removeClass('skip-active');
                                  $('#header-cart').removeClass('skip-active');

                                  // Clone our template
                                  var $notification = $notificationTemplate.clone();
                                  var fadeTimeout = null;

                                  if (data.message) {
                                    $notification.find('.sd-ajax-add-to-cart-popup__message').text(data.message);
                                  }

                                  $notification.find('.sd-ajax-add-to-cart-popup__close').on('click', function(e) {
                                    e.preventDefault();
                                    $notification.hide();
                                    $(document).trigger('sd_ajaxaddtocart:popup-close', ['sd_ajaxaddtocart:popup', $notification]);
                                    clearTimeout(fadeTimeout);
                                    fadeTimeout = null;
                                  });

                                  $notification.appendTo($notificationShowcase);
                                  $(document).trigger('sd_ajaxaddtocart:popup-open', ['sd_ajaxaddtocart:popup', $notification]);
                                  if (settings.popupTrackFocus) {
                                    // This marks the notification element as focusable, although not in the tab order.
                                    $notification.attr('tabindex', '-1').focus();
                                  }

                                  var doFade = function() {
                                    var $active = $(document.activeElement);
                                    if ($active.closest($notificationShowcase).length != 0 && settings.popupTrackFocus) {
                                      // We're focused in the notification.  Wait for it to blur.
                                      $active.one('blur', tryFadeOnBlur);
                                    } else {
                                      $(document).trigger('sd_ajaxaddtocart:popup-close', ['sd_ajaxaddtocart:popup', $notification]);
                                      $notification.fadeOut();
                                    }
                                  };
                                  var tryFadeOnBlur = function() {
                                    // If they closed, we're done.  Just ignore.
                                    if (fadeTimeout === null) {
                                      return;
                                    }

                                    var $active = $(document.activeElement);
                                    if ($active.closest($notificationShowcase).length != 0 && settings.popupTrackFocus) {
                                      // We're STILL focused in the notification.  Wait yet more.
                                      $active.one('blur', tryFadeOnBlur);
                                    } else {
                                      // Okay, now let's do the timeout again.  We'll check again if they refocus.
                                      fadeTimeout = setTimeout(doFade, settings.popupDuration * 1000);
                                    }
                                  };

                                  if (settings.popupDuration !== 0) {
                                    fadeTimeout = setTimeout(doFade, settings.popupDuration * 1000);
                                  }
                                }
                            })
                            .fail(function(jqXHR){
                                var data = jqXHR.responseJSON;
                                var errorMessages = data ? data.message : getDefaultErrorHtml();

                                // display failure message
                                // if add to cart from quickview
                                if (typeof(window.sdQuickView) == "object" && $('#sd-quickview').is(':visible')) {
                                    window.sdQuickview.content.prepend(errorMessages);
                                    
                                    // autoscroll up to the error message
                                    $('html, body').animate({
                                        scrollTop: $('.messages').offset().top - 100
                                    }, 'fast');
                                    
                                    //remove the failure message after 5s
                                    window.sdQuickview.content.find('.messages')
                                        .delay(5000)
                                        .fadeOut(function(){
                                            $(this).remove();
                                        });
                                } else {
                                    $('.col-main').prepend(errorMessages);

                                    // autoscroll up to the error message
                                    $('html, body').animate({
                                        scrollTop: $('.messages').offset().top - 100
                                    }, 'fast');
                                    
                                    //remove the failure message after 5s
                                    $('.col-main .messages')
                                        .delay(5000)
                                        .fadeOut(function(){
                                            $(this).remove();
                                        });
                                }

                                // Fire success event on failure and pass through data returned from response
                                $(document).trigger("sd_ajaxaddtocart:failure", [data, args]);

                                //unset the modal block
                                if (weHaveALoadingModal && settings.triggerLoadingModal) {
                                  loadingModal.remove();
                                }
                            })
                            .always(loadingModal.remove);
                    } catch (e) {
                        console.error(e);
                    }
                    this.form.action = oldUrl;
                    if (e) {
                        throw e;
                    }
                }
            }.bind(productAddToCartForm));
        }
    };

    if (typeof(productAddToCartForm) != "undefined") {
        // override default options with global sdAjaxaddtocartOptions variable
        var cartOptions = (typeof(sdAjaxaddtocartOptions) != "undefined")? sdAjaxaddtocartOptions : {};

        sdAjaxaddtocart.init(productAddToCartForm, cartOptions);
    }

})(jQuery);
