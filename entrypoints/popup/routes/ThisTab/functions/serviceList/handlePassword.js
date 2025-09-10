import getServices from '@/partials/sessionStorage/getServices';
import copyValue from '@/partials/functions/copyValue';
import decryptPassword from '@/partials/functions/decryptPassword';

const handlePassword = async (id, more, setMore) => {
  let servicesStorage, service;

  if (more) {
    setMore(false);
  }

  try {
    servicesStorage = await getServices();
    service = servicesStorage.find(service => service.id === id);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!service) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handlePasswordNoService, { additional: { func: 'handlePassword' } }));
    return;
  }

  if (!service.password || service.password.length <= 0) {
    navigator.clipboard.writeText('');
    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    return;
  }

  try {
    const decryptedPassword = await decryptPassword(service);
    await copyValue(decryptedPassword, service.id, 'password');
    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
  } catch (e) {
    showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
    await CatchError(e);
  }
};

export default handlePassword;
