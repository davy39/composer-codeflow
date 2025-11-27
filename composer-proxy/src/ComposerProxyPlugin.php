<?php

namespace Custom\Proxy;

use Composer\Composer;
use Composer\IO\IOInterface;
use Composer\Plugin\PluginInterface;
use Composer\EventDispatcher\EventSubscriberInterface;
use Composer\Plugin\PluginEvents;
use Composer\Plugin\PreFileDownloadEvent;

class CodetabsProxyPlugin implements PluginInterface, EventSubscriberInterface
{
    public function activate(Composer $composer, IOInterface $io) {}
    public function deactivate(Composer $composer, IOInterface $io) {}
    public function uninstall(Composer $composer, IOInterface $io) {}

    public static function getSubscribedEvents()
    {
        return [
            PluginEvents::PRE_FILE_DOWNLOAD => ['onPreFileDownload', 100],
        ];
    }

    public function onPreFileDownload(PreFileDownloadEvent $event)
    {
        $originalUrl = $event->getProcessedUrl();

        if (!preg_match('/^https?:\/\//', $originalUrl)) {
            return;
        }

        $localProxyBase = getenv('LOCAL_PROXY_URL');
        if (!$localProxyBase) {
            return;
        }

        // No loop
        if (strpos($originalUrl, '127.0.0.1') !== false) {
            return;
        }

        $newUrl = $localProxyBase . rawurlencode($originalUrl);
        
        $event->setProcessedUrl($newUrl);
    }
}