'use strict';

(function($, loadingModal, productAddToCartForm){

  $body = $('body');

  productAddToCartForm.submit = productAddToCartForm.submit.wrap(function(button, url){
    if (this.validator.validate()) {
      $body.addClass('locked');
      loadingModal.show();
      var form = this.form,
          oldUrl = form.action,
          e = null;

      if (url) {
        form.action = url;
      }

      try {
        $.ajax({
          url: form.action,
          dataType: 'json',
          type : 'post',
          data: $('#product_addtocart_form').serialize()
        })
        .done(function(data){
          $body.removeClass('locked');
          var $updatedCart = $(data.minicart_head);

          //TODO: make animation scroll optional
          $('html,body').animate({scrollTop: 0}, 250);

          //apply the minicart update and unfurl it
          $('#header-cart').html($updatedCart.find('#header-cart').html());
          $('.skip-cart').html($updatedCart.find('.skip-cart').html()).trigger('click'); 
        })
        .fail(function(data){
          //display failure message
          $('.col-main').prepend(data.message);
          $('.col-main .messages').delay(5000).fadeOut(function(){$(this).remove();});
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