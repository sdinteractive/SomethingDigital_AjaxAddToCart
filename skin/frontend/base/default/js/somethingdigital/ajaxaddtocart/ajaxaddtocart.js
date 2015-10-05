'use strict';

window.sdAjaxaddtocart = {
    init:function(productAddToCartForm) {
        var $body = jQuery('body');

        productAddToCartForm.submit = productAddToCartForm.submit.wrap(function(button, url){
            var form   = this.form;
            var oldUrl = form.action;
            var e      = null;

            if (this.validator.validate()) {
                $body.addClass('locked');
                loadingModal.show();

                try {
                    jQuery.ajax({
                        url: form.action,
                        dataType: 'json',
                        type: 'post',
                        data: jQuery('#product_addtocart_form').serialize()
                    })
                        .done(function(data){
                            var $updatedCart   = jQuery(data.minicart_head);
                            var headerCartHtml = $updatedCart.find('#header-cart').html();
                            var skipCartHtml   = $updatedCart.find('.skip-cart').html();

                            $body.removeClass('locked');

                            // If add to cart from quickview, close quickview
                            if(typeof(window.sdQuickview.close) == "function"
                                && jQuery('#sd-quickview').is(':visible')) {
                                window.sdQuickview.close();
                            }

                            //TODO: make animation scroll optional
                            jQuery('html,body').animate({scrollTop: 0}, 250);

                            //apply the minicart update and unfurl it
                            jQuery('#header-cart').html(headerCartHtml);
                            jQuery('.skip-cart').html(skipCartHtml).trigger('click');
                        })
                        .fail(function(data){
                            // display failure message
                            // if add to cart from quickview
                            if(typeof(window.sdQuickView) == "object" && jQuery('#sd-quickview').is(':visible')) {
                                window.sdQuickview.content.prepend(data.message);

                                //remove the failure message after 5s
                                window.sdQuickview.content.find('.messages')
                                    .delay(5000)
                                    .fadeOut(function(){
                                        jQuery(this).remove();
                                    });
                            } else {
                                jQuery('.col-main').prepend(data.message);

                                //remove the failure message after 5s
                                jQuery('.col-main .messages')
                                    .delay(5000)
                                    .fadeOut(function(){
                                        jQuery(this).remove();
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

(function($){

    if(typeof(productAddToCartForm) != "undefined") {
        sdAjaxaddtocart.init(productAddToCartForm);
    }

})(jQuery);