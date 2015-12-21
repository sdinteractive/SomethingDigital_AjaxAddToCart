SomethingDigital_AjaxAddToCart
==

Objective
--

The aim is to provide a drop-in replacement for the tradition card add form post, which requires a redirect in vanilla Magento.

Requirements
--

- Magento 1.9+ (RWD theme compatibility)
- jQuery

Configurable JS Options
--
| Option           |  Default                             |  Description                                               |
|------------------|--------------------------------------|------------------------------------------------------------|
| scroll             | true                                    | This will scroll the page up and open mini cart on success. |
| scrollDuration             | 250                                    | Duration of scroll animation in ms. |
| triggerMinicart             | true                                    | This will show the minicart when product added successfully. |

Events Fired through JS
--
**sd_ajaxaddtocart:success**

After a product is successfully added to the cart, a success event called `sd_ajaxaddtocart:success` is fired. It is easy to hook into this with jQuery. An example of listening for the event and firing a notification using [jGrowl](https://github.com/stanlemon/jGrowl):

```
  $j(document).on( "sd_ajaxaddtocart:success", function(e, data) {
    $j.jGrowl(data.message, { sticky: true, header: 'Added to Basket', footer: '<a href="<?php echo Mage::getBaseUrl() ?>checkout/cart" class="button--secondary">Go to basket</a>' });
  });
```

**sd_ajaxaddtocart:failure**

If a product can not be successfully added to the cart, a failure event called `sd_ajaxaddtocart:failure` is fired.


License
--

The MIT License

Copyright (c) 2015 Something Digital http://www.somethingdigital.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
