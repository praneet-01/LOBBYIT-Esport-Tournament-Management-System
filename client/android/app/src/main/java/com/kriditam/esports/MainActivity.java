package com.kriditam.esports;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQ_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestAppPermissions();
        startVoiceForegroundService();
    }

    private void requestAppPermissions() {
        List<String> neededPermissions = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            neededPermissions.add(Manifest.permission.RECORD_AUDIO);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS) != PackageManager.PERMISSION_GRANTED) {
            neededPermissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (!neededPermissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, neededPermissions.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }

    private void startVoiceForegroundService() {
        try {
            Intent serviceIntent = new Intent(this, ForegroundVoiceService.class);
            ContextCompat.startForegroundService(this, serviceIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            // Re-trigger foreground service so it can attach FOREGROUND_SERVICE_TYPE_MICROPHONE if permission was just granted
            startVoiceForegroundService();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        keepWebViewActive();
    }

    @Override
    public void onResume() {
        super.onResume();
        keepWebViewActive();
        startVoiceForegroundService();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Crucial: keep WebView active and timers running when minimized so WebRTC audio doesn't disconnect or mute
        keepWebViewActive();
    }

    @Override
    public void onStop() {
        super.onStop();
        // Crucial: keep WebView running even when stopped behind fullscreen games like BGMI
        keepWebViewActive();
    }

    private void keepWebViewActive() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                webView.onResume();
                webView.resumeTimers();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
