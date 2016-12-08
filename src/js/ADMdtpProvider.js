module.config(['ADMdtpProvider', ADMdtpConfig]);

    /* @ngInject */
    function ADMdtpConfig(ADMdtp) {
        try {
            document.createEvent("TouchEvent");
            ADMdtp.setOptions({isDeviceTouch: true});
        } catch (e) {
            ADMdtp.setOptions({isDeviceTouch: false});
        }
    }
