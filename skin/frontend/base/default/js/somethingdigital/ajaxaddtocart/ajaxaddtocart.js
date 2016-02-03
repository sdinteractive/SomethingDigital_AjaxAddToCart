'use strict';

(function($){

    window.sdAjaxaddtocart = {
        init:function(productAddToCartForm, options) {

            var settings = $.extend({
                scroll: false,
                scrollDuration: 250,
                triggerMinicart: true
            }, options);

            var $body = $('body');

            productAddToCartForm.submit = productAddToCartForm.submit.wrap(function(button, url){
                var form   = this.form;
                var oldUrl = form.action;
                var e      = null;

                if (this.validator.validate()) {
                    $body.addClass('locked');
                    loadingModal.show();

                    try {
                        $.ajax({
                            url: form.action,
                            dataType: 'json',
                            type: 'post',
                            data: $('#product_addtocart_form').serialize()
                        })
                            .done(function(data){
                                var $updatedCart   = $(data.minicart_head);
                                var headerCartHtml = $updatedCart.find('#header-cart').html();
                                var skipCartHtml   = $updatedCart.find('.skip-cart').html();

                                var $notificationTemplate = $('#ajax-atc___pop-up--template').children();
                                var $notificationShowcase = $('#ajax-atc___pop-up--showcase');

                                // Do we need to update the product form's action?
                                // This allows one to continue configuring, for example.
                                if (data.product_addtocart_form_action) {
                                    $('#product_addtocart_form').prop('action', data.product_addtocart_form_action);
                                }

                                $body.removeClass('locked');

                                // If add to cart from quickview, close quickview
                                if(typeof(window.sdQuickview) != "undefined"
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

                                if(settings.triggerMinicart) {
                                    $cartLink.trigger('click');
                                }

                                // Fire success event on success and pass through data returned from response
                                $(document).trigger("sd_ajaxaddtocart:success", data);

                                // Show our popup
                                if(!settings.scroll) {
                                  var $notification = $notificationTemplate.clone()
                                  $notification.find('.atc-pop-up__message').text(data.message);
                                  $notification.appendTo($notificationShowcase);
                                }

                            })
                            .fail(function(jqXHR){
                                var data = jqXHR.responseJSON;
                                // display failure message
                                // if add to cart from quickview
                                if(typeof(window.sdQuickView) == "object" && $('#sd-quickview').is(':visible')) {
                                    window.sdQuickview.content.prepend(data.message);

                                    //remove the failure message after 5s
                                    window.sdQuickview.content.find('.messages')
                                        .delay(5000)
                                        .fadeOut(function(){
                                            $(this).remove();
                                        });
                                } else {
                                    $('.col-main').prepend(data.message);

                                    //remove the failure message after 5s
                                    $('.col-main .messages')
                                        .delay(5000)
                                        .fadeOut(function(){
                                            $(this).remove();
                                        });
                                }

                                // Fire success event on failure and pass through data returned from response
                                $(document).trigger("sd_ajaxaddtocart:failure", data);

                                //unset the modal block
                                loadingModal.remove();
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

    if(typeof(productAddToCartForm) != "undefined") {
        sdAjaxaddtocart.init(productAddToCartForm);
    }

})(jQuery);
