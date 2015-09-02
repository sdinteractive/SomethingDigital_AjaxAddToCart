'use strict';

(function($, loadingModal, productAddToCartForm){

  $body = $('body');

  productAddToCartForm.submit = productAddToCartForm.submit.wrap(function(button, url){
    var form   = this.form;
    var oldUrl = form.action;
    var e      = null;

    if (this.validator.validate()) {
      $body.addClass('locked');
      loadingModal.show();

      if (url) {
        form.action = url;
      }

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

          $body.removeClass('locked');

          //TODO: make animation scroll optional
          $('html,body').animate({scrollTop: 0}, 250);

          //apply the minicart update and unfurl it
          $('#header-cart').html(headerCartHtml);
          $('.skip-cart').html(skipCartHtml).trigger('click'); 
        })
        .fail(function(data){

          //display failure message
          $('.col-main').prepend(data.message);
          
          //remove the failure message after 5s
          $('.col-main .messages')
            .delay(5000)
            .fadeOut(function(){
                $(this).remove();
            });

          //unset the modal block
          loadingModal.remove()
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


})(jQuery, loadingModal, productAddToCartForm);