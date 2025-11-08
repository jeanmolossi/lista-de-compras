# ======= Config =======

SHELL := /bin/bash

ANDROID_DIR    ?= android
GRADLEW        := $(ANDROID_DIR)/gradlew
APP_ID         ?= com.seuapp.lista

# Caminho de saida do APK release (default do Gradle)
APK_PATH       ?= $(ANDROID_DIR)/app/build/outputs/apk/release/app-release.apk
AAB_PATH       ?= $(ANDROID_DIR)/app/build/outputs/bundle/release/app-release.aab

# Keystore (NÃO COMITAR, pelo amor of God)
KEYSTORE_PATH  ?= $(ANDROID_DIR)/app/myapp-release.keystore
KEY_ALIAS      ?= myapp
KEY_STORE_PWD  ?= change_me
KEY_PWD        ?= change_me

# Versoes (bump via sed)
VERSION_CODE   ?= 1
VERSION_NAME   ?= 1.0.0

# ======= Helpers =======
.PHONY: help
help:
	@echo "Targets:"
	@echo "  make keystore            - Gera keystore de release (se não existir)"
	@echo "  make props               - Injeta credenciais no gradle.properties"
	@echo "  make bump                - Seta versionCode/Name no build.gradle (ingênuo)"
	@echo "  make clean               - Limpa build"
	@echo "  make assemble-release    - Gera APK release"
	@echo "  make bundle-release      - Gera AAB release (Play Store)"
	@echo "  make install             - Instala APK no device via adb"
	@echo "  make uninstall           - Remove o app do device"
	@echo "  make reinstall           - Desinstala + instala"
	@echo "  make logcat              - Logcat filtrado pelo package"
	@echo "  make release             - keystore + props + bump + assemble-release"
	@echo "  make release-install     - Tudo e instala (combo pra preguiçoso)"


# ======= Keystore & Props =======
.PHONY: keystore
keystore:
	@if [ -f "$(KEYSTORE_PATH)" ]; then \
		echo "Keystore já existe: $(KEYSTORE_PATH)"; \
	else \
		echo ">> Gerando keystore em $(KEYSTORE_PATH)"; \
		keytool -genkeypair -v \
			-keystore "$(KEYSTORE_PATH)" \
			-alias "$(KEY_ALIAS)" \
			-keyalg RSA -keysize 2048 -validity 10000 \
			-dname "CN=Jean,O=Dev,L=BR,ST=SP,C=BR" \
			-storepass "$(KEY_STORE_PWD)" \
			-keypass   "$(KEY_PWD)"; \
		echo "OK"; \
	fi

# Escreve credenciais no gradle.properties
.PHONY: props
props:
	@echo ">> Atualizando $(ANDROID_DIR)/gradle.properties"
	@grep -q '^MYAPP_UPLOAD_STORE_FILE' $(ANDROID_DIR)/gradle.properties 2>/dev/null && \
		sed -i.bak 's#^MYAPP_UPLOAD_STORE_FILE=.*#MYAPP_UPLOAD_STORE_FILE=$(KEYSTORE_PATH)#' $(ANDROID_DIR)/gradle.properties || \
		echo "MYAPP_UPLOAD_STORE_FILE=$(KEYSTORE_PATH)" >> $(ANDROID_DIR)/gradle.properties
	@grep -q '^MYAPP_UPLOAD_KEY_ALIAS' $(ANDROID_DIR)/gradle.properties 2>/dev/null && \
		sed -i.bak 's#^MYAPP_UPLOAD_KEY_ALIAS=.*#MYAPP_UPLOAD_KEY_ALIAS=$(KEY_ALIAS)#' $(ANDROID_DIR)/gradle.properties || \
		echo "MYAPP_UPLOAD_KEY_ALIAS=$(KEY_ALIAS)" >> $(ANDROID_DIR)/gradle.properties
	@grep -q '^MYAPP_UPLOAD_STORE_PASSWORD' $(ANDROID_DIR)/gradle.properties 2>/dev/null && \
		sed -i.bak 's#^MYAPP_UPLOAD_STORE_PASSWORD=.*#MYAPP_UPLOAD_STORE_PASSWORD=$(KEY_STORE_PWD)#' $(ANDROID_DIR)/gradle.properties || \
		echo "MYAPP_UPLOAD_STORE_PASSWORD=$(KEY_STORE_PWD)" >> $(ANDROID_DIR)/gradle.properties
	@grep -q '^MYAPP_UPLOAD_KEY_PASSWORD' $(ANDROID_DIR)/gradle.properties 2>/dev/null && \
		sed -i.bak 's#^MYAPP_UPLOAD_KEY_PASSWORD=.*#MYAPP_UPLOAD_KEY_PASSWORD=$(KEY_PWD)#' $(ANDROID_DIR)/gradle.properties || \
		echo "MYAPP_UPLOAD_KEY_PASSWORD=$(KEY_PWD)" >> $(ANDROID_DIR)/gradle.properties
	@echo "OK"

# Bump de versão no build.gradle (simples; ajuste se seu gradle for diferente)
.PHONY: bump
bump:
	@echo ">> Atualizando versão em $(ANDROID_DIR)/app/build.gradle"
	@sed -i.bak 's/versionCode [0-9][0-9]*/versionCode $(VERSION_CODE)/' $(ANDROID_DIR)/app/build.gradle
	@sed -i.bak 's/versionName "[^"]*"/versionName "$(VERSION_NAME)"/' $(ANDROID_DIR)/app/build.gradle
	@echo "versionCode=$(VERSION_CODE), versionName=$(VERSION_NAME)"


# ======= Build =======
.PHONY: clean
clean:
	@cd $(ANDROID_DIR) && ./gradlew clean

.PHONY: assemble-release
assemble-release:
	@cd $(ANDROID_DIR) && \
		export $(shell grep -v '^#' .env | xargs) && \
		./gradlew assembleRelease

.PHONY: bundle-release
bundle-release:
	@cd $(ANDROID_DIR) && \
  	export $(shell grep -v '^#' .env | xargs) && \
		&& ./gradlew bundleRelease

# ======= Device Ops =======
.PHONY: uninstall
uninstall:
	@adb uninstall $(APP_ID) >/dev/null 2>&1 || true
	@echo "Uninstall OK (ou já não estava instalado)."

.PHONY: install
install:
	@test -f "$(APK_PATH)" || (echo "APK não encontrado em $(APK_PATH). Rode 'make assemble-release'." && exit 1)
	@adb devices | grep -v "List" | grep -q "device" || (echo "Nenhum device conectado. Ative USB debugging e rode 'adb devices'." && exit 1)
	@adb install -r "$(APK_PATH)"
	@echo "Install OK"

.PHONY: reinstall
reinstall: uninstall install

.PHONY: logcat
logcat:
	@adb logcat | grep -i $(APP_ID)

# ======= Pipelines =======
.PHONY: release
release: keystore props bump clean assemble-release
	@echo "Release APK pronto em: $(APK_PATH)"

.PHONY: release-install
release-install: release install
	@echo "Pronto. Abre no seu aparelho e vai jogar dinheiro fora no mercado."
