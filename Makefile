NAME=workspace_switch_gesture@exalm
INSTALL_PATH=~/.local/share/gnome-shell/extensions

$(NAME).zip:
	zip $(NAME).zip $(NAME) -r

install:
	rm -rf $(INSTALL_PATH)/$(NAME)
	cp $(NAME) $(INSTALL_PATH) -r

clean:
	rm *.zip

.PHONY: install clean