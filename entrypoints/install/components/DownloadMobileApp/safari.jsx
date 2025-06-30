// LICENSE

import bS from '@/partials/global-styles/buttons.module.scss';

/** 
* Function component for the DownloadMobileAppDefault.
* @return {JSX.Element} The rendered component.
*/
const DownloadMobileAppDefault = () => {
  return (
    <>
      <a
        className={`${bS.btn} ${bS.btnTheme} ${bS.btnInstallPageDownload}`}
        href="https://2fas.com/download"
        target="_blank"
        rel="noopener noreferrer"
      >
        {browser.i18n.getMessage('install_get_mobile_app')}
      </a>
    </>
  );
};

export default DownloadMobileAppDefault;
