'use strict';

(function($){

    window.sdAjaxaddtocart = {
        init:function(productAddToCartForm, options) {
            
            var settings = $.extend({
              scroll: true,
              onSuccess: function() {}
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
                                    $('html,body').animate({scrollTop: 0}, 250);
                                }

                                //apply the minicart update and unfurl it
                                $('#header-cart').html(headerCartHtml);
                                
                                if(settings.scroll) {
                                    $('.skip-cart').html(skipCartHtml).trigger('click');
                                }
                                
                                // Fire callback function on success and pass through data returned from response
                                settings.onSuccess.call(this, data);
                            })
                            .fail(function(data){
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
