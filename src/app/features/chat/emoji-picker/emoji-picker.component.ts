import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-emoji-picker',
  imports: [NgFor, NgIf],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss'
})
export class EmojiPickerComponent {
  @Input() isVisible: boolean = false;
  @Output() emojiSelected = new EventEmitter<string>();

  emojis = [
    'beaming_face_with_smiling_eyes', 'flexed_biceps', 'grinning_face_with_big_eyes',
    'grinning_face_with_big_sweat', 'index_pointing_up', 'melting_face',
    'rolling_on_the_floor_laughing', 'sneezing_face', 'thumbs_down',
    'thumbs_up', 'vulcan_salute', 'waving_hand', 'winking_face'
  ];

  onEmojiClick(emoji: string) {
    this.emojiSelected.emit(emoji);
  }

  getEmojiImagePath(emojiName: string): string {
    return `/emojis/${emojiName}.svg`;
  }

  ngOnInit() {
  }

  ngOnChanges() {
  }
}